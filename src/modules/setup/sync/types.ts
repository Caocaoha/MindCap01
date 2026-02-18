/**
 * Purpose: Định nghĩa cấu trúc dữ liệu gói tin đồng bộ giữa MindCap và Obsidian.
 * Inputs/Outputs: Định nghĩa Interface cho Export/Import.
 * Business Rule: 
 * - Đảm bảo tính nhất quán dữ liệu khi đóng gói thành file JSON.
 * - Hỗ trợ metadata tiêu chuẩn cho Obsidian Frontmatter.
 */

export interface MindCapIdea {
    id: string;
    content: string;
    rawKeywords: string[];       // Kết quả từ NLP (Nouns/Phrases) 
    interactionScore: number;    // EchoLink Scoring dựa trên view/edit/time 
    syncStatus: 'pending' | 'ready_to_export' | 'synced';
    metadata: {
      title?: string;
      suggestedTags: string[];   // Tag AI gợi ý từ nội dung 
      obsidianPath?: string;     // Tag đã mapping chính thức 
      createdAt: number;
      updatedAt: number;         // Dùng cho Smart Merge logic 
    };
  }
  
  export interface TagMapping {
    mindcapTag: string;          // Từ khóa từ NLP 
    obsidianTag: string;         // Tag tương ứng trong Obsidian 
    lastUsed: number;
  }
  
  export interface MindCapSyncPackage {
    version: string;
    exportTimestamp: number;
    ideas: MindCapIdea[];        // Chỉ các bản ghi có syncStatus = 'ready_to_export' 
    tagMappings: TagMapping[];   // Đồng bộ cả bảng mapping để nhất quán tag 
    appSettings: Record<string, any>;
  }