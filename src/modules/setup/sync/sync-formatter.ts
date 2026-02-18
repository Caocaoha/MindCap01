/**
 * Purpose: Định dạng Markdown Single-file tối giản.
 * Business Rule: Bỏ Header ###, dùng block-id cố định theo ID database.
 */

export const syncFormatter = {
    formatSingleFile(ideas: any[]): string {
      const date = new Date().toISOString().split('T')[0];
      let content = `# 📥 MindCap Export: ${date}\n\n`;
      content += `## 📊 Tổng quan phiên\n- **Số lượng:** ${ideas.length} bản ghi\n---\n\n`;
  
      content += ideas.map(idea => {
        const tags = (idea.tags || []).map((t: string) => "#" + t).join(' ') || '#uncategorized';
        
        let entry = `- **ID::** ${idea.id}\n`;
        entry += `- **Score::** ${idea.interactionScore || 0}\n`;
        entry += `- **Topic::** ${tags}\n`;
        entry += `- **Content:**\n    > ${idea.content.replace(/\n/g, '\n    > ')}\n`;
        
        if (idea.isBookmarked && idea.bookmarkReason) {
          entry += `- **Bookmark:** *${idea.bookmarkReason}*\n`;
        }
        
        // Dùng ID cố định để tránh tạo block ID mới mỗi lần xuất trùng
        entry += `\n^block-${idea.sourceTable || 'rec'}-${idea.id}\n`;
        return entry;
      }).join('\n---\n\n');
  
      return content;
    }
  };