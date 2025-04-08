/**
 * Build configuration for production deployment
 * Run with Node.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Source directory
  srcDir: './',
  
  // Output directory
  distDir: './dist',
  
  // Files to include
  include: [
    'index.html',
    'css/**/*.css',
    'js/**/*.js',
    'images/**/*.*'
  ],
  
  // Files to exclude from processing
  exclude: [
    'node_modules/**',
    'build-config.js',
    'README.md'
  ]
};

// Create distribution directory
if (!fs.existsSync(config.distDir)) {
  fs.mkdirSync(config.distDir, { recursive: true });
}

// Copy files
config.include.forEach(pattern => {
  const parts = pattern.split('/');
  const isDirectory = pattern.endsWith('/*.*') || pattern.endsWith('/**');
  const basePath = parts.slice(0, parts.length - (isDirectory ? 1 : 0)).join('/');
  
  if (isDirectory) {
    // Create directory in dist
    const targetDir = path.join(config.distDir, basePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy all files
    const files = fs.readdirSync(basePath);
    files.forEach(file => {
      const sourcePath = path.join(basePath, file);
      const targetPath = path.join(config.distDir, basePath, file);
      
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied: ${sourcePath} -> ${targetPath}`);
      }
    });
  } else {
    // Create target directory
    const targetDir = path.dirname(path.join(config.distDir, pattern));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy single file
    fs.copyFileSync(pattern, path.join(config.distDir, pattern));
    console.log(`Copied: ${pattern}`);
  }
});

console.log('Build completed successfully!');

// Additional steps could include:
// - Minification
// - Bundling
// - Image optimization
// - Hash generation for cache busting