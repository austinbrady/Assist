import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, readdirSync, createReadStream, readFileSync } from 'fs';
import multer from 'multer';

export const filesystemRouter = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

/**
 * Security: Validate that a path is safe to access
 * Prevents directory traversal attacks
 */
function validatePath(userPath: string): { valid: boolean; resolvedPath?: string; error?: string } {
  try {
    // Resolve to absolute path
    const resolved = path.resolve(userPath);
    
    // Security: Prevent access to system directories
    const forbiddenPaths = [
      '/System',
      '/Library',
      '/private',
      '/usr',
      '/bin',
      '/sbin',
      '/etc',
      '/var',
      '/tmp',
      '/opt',
      '/home',
      '/root',
    ];
    
    // Check if path is in forbidden directories (case-insensitive)
    const normalized = resolved.toLowerCase();
    for (const forbidden of forbiddenPaths) {
      if (normalized.startsWith(forbidden.toLowerCase())) {
        return { valid: false, error: 'Access to system directories is not allowed' };
      }
    }
    
    // Additional check: Ensure path exists
    if (!existsSync(resolved)) {
      return { valid: false, error: 'Path does not exist' };
    }
    
    return { valid: true, resolvedPath: resolved };
  } catch (error: any) {
    return { valid: false, error: error.message || 'Invalid path' };
  }
}

/**
 * Detect project type from directory contents
 */
function detectProjectType(dirPath: string): { type: string; metadata: any } {
  try {
    const files = readdirSync(dirPath, { withFileTypes: true });
    const fileNames = files.map(f => f.name.toLowerCase());
    
    // Check for audio files
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    const hasAudioFiles = files.some(f => 
      f.isFile() && audioExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    
    // Check for video files
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
    const hasVideoFiles = files.some(f => 
      f.isFile() && videoExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    
    // Check for code/project files
    const codeIndicators = ['package.json', 'requirements.txt', 'cargo.toml', 'go.mod', 'pom.xml', 
                            'composer.json', 'gemfile', 'makefile', 'cmakelists.txt', '.git',
                            'src', 'lib', 'app', 'main.py', 'main.js', 'index.js', 'index.ts'];
    const hasCodeFiles = fileNames.some(name => 
      codeIndicators.some(indicator => name.includes(indicator))
    );
    
    // Check for image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const hasImageFiles = files.some(f => 
      f.isFile() && imageExtensions.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    
    // Determine primary type
    if (hasAudioFiles && !hasCodeFiles) {
      // Find audio files
      const audioFiles = files
        .filter(f => f.isFile() && audioExtensions.some(ext => f.name.toLowerCase().endsWith(ext)))
        .map(f => f.name);
      
      return {
        type: 'audio',
        metadata: {
          audioFiles,
          primaryFile: audioFiles[0] || null,
        }
      };
    } else if (hasVideoFiles && !hasCodeFiles) {
      return {
        type: 'video',
        metadata: {
          videoFiles: files.filter(f => f.isFile() && videoExtensions.some(ext => f.name.toLowerCase().endsWith(ext))).map(f => f.name),
        }
      };
    } else if (hasCodeFiles) {
      // Detect specific framework/type
      let framework = 'generic';
      if (fileNames.includes('package.json')) {
        const packageJsonPath = path.join(dirPath, 'package.json');
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (packageJson.dependencies?.['react'] || packageJson.dependencies?.['next']) {
            framework = 'react';
          } else if (packageJson.dependencies?.['vue']) {
            framework = 'vue';
          } else if (packageJson.dependencies?.['angular']) {
            framework = 'angular';
          } else {
            framework = 'node';
          }
        } catch (e) {
          framework = 'node';
        }
      } else if (fileNames.includes('requirements.txt')) {
        framework = 'python';
      } else if (fileNames.includes('cargo.toml')) {
        framework = 'rust';
      } else if (fileNames.includes('go.mod')) {
        framework = 'go';
      }
      
      return {
        type: 'app',
        metadata: {
          framework,
          hasAudio: hasAudioFiles,
          hasVideo: hasVideoFiles,
          hasImages: hasImageFiles,
        }
      };
    } else if (hasImageFiles) {
      return {
        type: 'image',
        metadata: {
          imageFiles: files.filter(f => f.isFile() && imageExtensions.some(ext => f.name.toLowerCase().endsWith(ext))).map(f => f.name),
        }
      };
    }
    
    return {
      type: 'generic',
      metadata: {}
    };
  } catch (error: any) {
    logger.error('Error detecting project type', { error: error.message });
    return {
      type: 'unknown',
      metadata: {}
    };
  }
}

/**
 * List directory contents
 * GET /api/filesystem/list?path=/path/to/directory
 */
filesystemRouter.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { path: dirPath } = req.query;
    
    if (!dirPath || typeof dirPath !== 'string') {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    // Validate path
    const validation = validatePath(dirPath);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error || 'Invalid path' });
    }

    const resolvedPath = validation.resolvedPath!;

    // Check if path is a directory
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    // Detect project type
    const projectInfo = detectProjectType(resolvedPath);

    // Read directory contents
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(resolvedPath, entry.name);
        const stats = await fs.stat(fullPath);
        
        return {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          // Only include children for directories (will be loaded on demand)
          children: entry.isDirectory() ? [] : undefined,
        };
      })
    );

    // Sort: directories first, then files, both alphabetically
    files.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    res.json({
      path: resolvedPath,
      files,
      projectType: projectInfo.type,
      metadata: projectInfo.metadata,
    });

  } catch (error: any) {
    logger.error('List directory error', { error: error.message });
    res.status(500).json({ error: 'Failed to list directory' });
  }
});

/**
 * Read file contents
 * GET /api/filesystem/read?path=/path/to/file
 */
filesystemRouter.get('/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { path: filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    // Validate path
    const validation = validatePath(filePath);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error || 'Invalid path' });
    }

    const resolvedPath = validation.resolvedPath!;

    // Check if path is a file
    const stats = await fs.stat(resolvedPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    // Check if this is a streaming request (for audio/video files)
    const { stream } = req.query;
    if (stream === 'true') {
      // Stream the file directly
      res.setHeader('Content-Length', stats.size);
      
      // Determine content type based on file extension
      const ext = path.extname(resolvedPath).toLowerCase();
      const contentTypes: { [key: string]: string } = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.flac': 'audio/flac',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.wma': 'audio/x-ms-wma',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm',
      };
      
      if (contentTypes[ext]) {
        res.setHeader('Content-Type', contentTypes[ext]);
      } else {
        res.setHeader('Content-Type', 'application/octet-stream');
      }
      
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(resolvedPath)}"`);
      res.setHeader('Accept-Ranges', 'bytes');
      
      const fileStream = createReadStream(resolvedPath);
      fileStream.pipe(res);
      return;
    }

    // Check file size (limit to 10MB for safety)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (stats.size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File is too large (max 10MB)' });
    }

    // Read file
    const content = await fs.readFile(resolvedPath, 'utf-8');

    res.json({
      path: resolvedPath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    });

  } catch (error: any) {
    logger.error('Read file error', { error: error.message });
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.status(500).json({ error: 'Failed to read file' });
  }
});

/**
 * Write file contents
 * POST /api/filesystem/write
 * Body: { path: '/path/to/file', content: 'file content' }
 */
filesystemRouter.post('/write', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { path: filePath, content } = req.body;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Path is required' });
    }

    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Validate path
    const validation = validatePath(filePath);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error || 'Invalid path' });
    }

    const resolvedPath = validation.resolvedPath!;

    // Check if parent directory exists
    const parentDir = path.dirname(resolvedPath);
    if (!existsSync(parentDir)) {
      return res.status(400).json({ error: 'Parent directory does not exist' });
    }

    // Check content size (limit to 10MB)
    const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB
    if (typeof content === 'string' && content.length > MAX_CONTENT_SIZE) {
      return res.status(413).json({ error: 'Content is too large (max 10MB)' });
    }

    // Write file
    await fs.writeFile(resolvedPath, content, 'utf-8');

    // Get updated stats
    const stats = await fs.stat(resolvedPath);

    res.json({
      path: resolvedPath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      message: 'File saved successfully',
    });

  } catch (error: any) {
    logger.error('Write file error', { error: error.message });
    res.status(500).json({ error: 'Failed to write file' });
  }
});

/**
 * Upload file to project directory
 * POST /api/filesystem/upload
 * Form data: file, targetPath (optional - defaults to project root)
 */
filesystemRouter.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { targetPath } = req.body;
    
    // If targetPath is provided, validate it
    let destinationPath: string;
    if (targetPath && typeof targetPath === 'string') {
      const validation = validatePath(targetPath);
      if (!validation.valid) {
        // Clean up temp file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(403).json({ error: validation.error || 'Invalid target path' });
      }
      
      // Check if target is a directory
      const stats = await fs.stat(validation.resolvedPath!);
      if (!stats.isDirectory()) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: 'Target path is not a directory' });
      }
      
      destinationPath = path.join(validation.resolvedPath!, req.file.originalname);
    } else {
      // No target path - save to temp and return path for user to specify
      return res.json({
        temp_path: req.file.path,
        filename: req.file.originalname,
        size: req.file.size,
        message: 'File uploaded to temp. Please specify target path.',
      });
    }

    // Move file from temp to destination
    await fs.rename(req.file.path, destinationPath);

    // Get final stats
    const stats = await fs.stat(destinationPath);

    res.json({
      path: destinationPath,
      filename: req.file.originalname,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      message: 'File uploaded successfully',
    });

  } catch (error: any) {
    logger.error('Upload file error', { error: error.message });
    
    // Clean up temp file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * Get file/directory info
 * GET /api/filesystem/info?path=/path/to/file
 */
filesystemRouter.get('/info', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { path: itemPath } = req.query;
    
    if (!itemPath || typeof itemPath !== 'string') {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    // Validate path
    const validation = validatePath(itemPath);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error || 'Invalid path' });
    }

    const resolvedPath = validation.resolvedPath!;

    // Get stats
    const stats = await fs.stat(resolvedPath);

    res.json({
      path: resolvedPath,
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
    });

  } catch (error: any) {
    logger.error('Get file info error', { error: error.message });
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Path not found' });
    }
    
    res.status(500).json({ error: 'Failed to get file info' });
  }
});
