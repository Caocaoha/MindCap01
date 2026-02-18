/**
 * Purpose: Chuyển đổi dữ liệu MindCapIdea sang định dạng tệp Markdown (.md) cho Obsidian.
 * Inputs: Đối tượng MindCapIdea.
 * Outputs: Chuỗi văn bản Markdown hoàn chỉnh với Frontmatter.
 * Business Rule: 
 * - Tuân thủ cấu trúc Frontmatter chuẩn: title, source, created, tags, score, origin_id.
 * - Định dạng thời gian theo chuẩn ISO 8601.
 * - Quy tắc đặt tên tệp: YYYYMMDD-HHmm-MindCap.md.
 */

import { MindCapIdea } from './types';

export const markdownTransformer = {
  /**
   * Chuyển đổi một ý tưởng thành nội dung Markdown.
   */
  toMarkdown(idea: MindCapIdea): string {
    const createdDate = new Date(idea.metadata.createdAt).toISOString();
    
    // Chuẩn bị danh sách tag (kết hợp obsidianPath và suggestedTags)
    const tags = idea.metadata.obsidianPath 
      ? [idea.metadata.obsidianPath] 
      : idea.metadata.suggestedTags;

    const frontmatter = [
      '---',
      `title: ${idea.metadata.title || 'Untitled'}`,
      'source: MindCap',
      `created: ${createdDate}`,
      `tags: [${tags.join(', ')}]`,
      `score: ${idea.interactionScore || 0}`,
      `origin_id: ${idea.id}`,
      '---',
      '',
      idea.content
    ].join('\n');

    return frontmatter;
  },

  /**
   * Tạo tên tệp chuẩn dựa trên thời gian tạo của ý tưởng.
   */
  generateFileName(idea: MindCapIdea): string {
    const date = new Date(idea.metadata.createdAt);
    
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${YYYY}${MM}${DD}-${HH}${mm}-MindCap.md`;
  }
};