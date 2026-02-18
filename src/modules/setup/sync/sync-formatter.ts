/**
 * Purpose: Định dạng mảng ý tưởng thành nội dung Markdown tổng hợp.
 * Inputs/Outputs: ExtendedIdea[] -> string.
 * Business Rule: 
 * - Loại bỏ Header tiêu đề mẩu tin (###).
 * - Metadata định dạng Dataview (::).
 * - Tích hợp Bookmark trực tiếp dưới Content nếu tồn tại.
 */

import { ExtendedIdea } from './obsidian-writer';

export const syncFormatter = {
  formatSingleFile(ideas: ExtendedIdea[]): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let content = `# 📥 MindCap Export: ${dateStr} | ${timeStr}\n\n`;
    content += `## 📊 Tổng quan phiên\n- **Số lượng:** ${ideas.length} bản ghi\n`;
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