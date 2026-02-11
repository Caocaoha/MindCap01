// src/utils/dataHandler.ts
import { db } from '../database/db';
import 'dexie-export-import';

export const DataHandler = {
  /**
   * Xuất toàn bộ dữ liệu ra file JSON
   */
  exportData: async () => {
    try {
      const blob = await db.export();
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `MindCap_Backup_${timestamp}.json`;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error("Export failed:", error);
      return false;
    }
  },

  /**
   * Nhập dữ liệu từ file JSON (Ghi đè)
   */
  importData: async (file: File) => {
    try {
      await db.delete(); // Xóa sạch dữ liệu cũ
      await db.open();   // Mở lại DB trống
      await db.import(file); // Import dữ liệu mới
      return true;
    } catch (error) {
      console.error("Import failed:", error);
      return false;
    }
  },

  /**
   * NUCLEAR OPTION: Xóa sạch dấu vết
   */
  nukeData: async () => {
    try {
      await db.delete();
      localStorage.clear(); // Xóa cả các config tạm
      return true;
    } catch (error) {
      console.error("Nuke failed:", error);
      return false;
    }
  }
};