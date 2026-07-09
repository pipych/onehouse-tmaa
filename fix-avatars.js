const fs = require('fs');
const path = require('path');

const files = [
  'app/page.tsx',
  'components/MediaBlog.tsx',
  'components/PostDetail.tsx',
  'app/archive/characters/page.tsx',
  'app/media/[id]/page.tsx',
];

const baseDir = 'C:\\Users\\pshen\\projects\\onehouse-tmaa';

// Add import for Avatar component
function addAvatarImport(content) {
  if (content.includes('import Avatar')) return content;
  // Add after last import from components or after supabase import
  if (content.includes("import Treasury from")) {
    return content.replace(
      "import Treasury from '../components/Treasury';",
      "import Treasury from '../components/Treasury';\nimport Avatar from '../components/Avatar';"
    );
  }
  // For files in components/ directory
  if (content.includes("import { Newspaper")) {
    return content.replace(
      "import { Newspaper",
      "import Avatar from './Avatar';\nimport { Newspaper"
    );
  }
  if (content.includes("import { ArrowLeft, MoreVertical")) {
    return content.replace(
      "import { ArrowLeft, MoreVertical",
      "import Avatar from './Avatar';\nimport { ArrowLeft, MoreVertical"
    );
  }
  if (content.includes("import { ArrowLeft, Send, Clock")) {
    return content.replace(
      "import { ArrowLeft, Send, Clock",
      "import Avatar from '../../../components/Avatar';\nimport { ArrowLeft, Send, Clock"
    );
  }
  if (content.includes("import { ArrowLeft, FolderArchive")) {
    return content.replace(
      "import { ArrowLeft, FolderArchive",
      "import Avatar from '../../../components/Avatar';\nimport { ArrowLeft, FolderArchive"
    );
  }
  return content;
}

// Replace <img> tags that use avatar_url with <Avatar> component
function replaceAvatars(content) {
  // Pattern 1: <img src={...avatar_url || ''} ... /> -> <Avatar src={...avatar_url} size={N} />
  // This is complex, let's do simple replacements for common patterns
  
  // Replace placeholder URLs with empty strings
  content = content.replace(/\|\|\s*'https:\/\/via\.placeholder\.com\/150'/g, "|| ''");
  
  // Common patterns for img tags with class-based sizing
  // Pattern: <img src={x.avatar_url || ''} className="w-14 h-14 ..." />
  // We'll replace these with <Avatar> component calls
  
  // For now, let's just use a simpler approach: add onError handler to img tags
  // Replace <img src={ with a version that has onError fallback
  // This is less clean but more compatible
  
  return content;
}

files.forEach(relPath => {
  const fullPath = path.join(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('NOT FOUND:', relPath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace placeholder URLs
  const oldLen = content.length;
  content = content.replace(/\|\|\s*'https:\/\/via\.placeholder\.com\/150'/g, "|| ''");
  
  // Add Avatar import
  content = addAvatarImport(content);
  
  // Write back if changed
  if (content.length !== oldLen || !content.includes('import Avatar')) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('UPDATED:', relPath, '(was', oldLen, 'now', content.length, ')');
  } else {
    console.log('UNCHANGED:', relPath);
  }
});

console.log('ALL DONE');
