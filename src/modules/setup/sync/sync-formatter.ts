/**
 * Purpose: Định dạng dữ liệu tri thức sang Markdown tổng hợp (Single-file).
 * Inputs/Outputs: ExtendedIdea[] -> string (Markdown Content).
 * Business Rule: 
 * - Loại bỏ Header tiêu đề mẩu tin để tệp tin sạch hơn.
 * - Tự động bóc tách và chèn Bookmark Reason nếu bản ghi có nhãn bookmark.
 * - Chuẩn hóa Metadata theo định dạng Dataview (::) để hỗ trợ truy vấn.
 */

import { ExtendedIdea } from './obsidian-writer';

export const syncFormatter = {
  formatSingleFile(ideas: ExtendedIdea[]): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let content = `# 📥 MindCap Export: ${dateStr} | ${timeStr}\n\n`;
    content += `## 📊 Tổng quan phiên\n`;
    content += `- **Số lượng:** ${ideas.length} bản ghi\n`;
    content += `- **Trạng thái:** #inbox/processing\n\n---\n\n`;

    content += ideas.map(idea => {
      const tags = (idea.tags || []).map((t: string) => "#" + t).join(' ') || '#uncategorized';
      const shortId = Math.random().toString(36).substring(2, 8);
      
      let entry = `- **ID::** ${idea.id}\n`;
      entry += `- **Score::** ${idea.interactionScore || 0}\n`;
      entry += `- **Topic::** ${tags}\n`;
      entry += `- **Content:**\n    > ${idea.content.replace(/\n/g, '\n    > ')}\n`;
      
      if (idea.isBookmarked && idea.bookmarkReason) {
        entry += `- **Bookmark:** *${idea.bookmarkReason}*\n`;
      }
      
      entry += `\n^block-${shortId}\n`;
      return entry;
    }).join('\n---\n\n');

    return content;
  }
};