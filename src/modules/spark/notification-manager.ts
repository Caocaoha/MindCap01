import { db } from '../../database/db';
import { ITask, IThought } from '../../database/types';
import { SparkEngine } from './spark-engine';

/**
 * [SERVICE]: Spark Notification Manager.
 * Quản lý việc đăng ký, hủy và xử lý tương tác thông báo cục bộ.
 * Tích hợp cơ chế Waterfall Scheduling và Deep Linking.
 */
export const SparkNotificationManager = {
  /**
   * Đăng ký lịch trình Giai đoạn 1 cho bản ghi mới.
   * [10p, 24h, 72h] - Kích hoạt khi entry mới được tạo.
   */
  async scheduleInitial(entry: ITask | IThought): Promise<void> {
    const triggers = SparkEngine.calculateInitialSchedule(entry.content);
    if (triggers.length === 0) return;

    for (let i = 0; i < triggers.length; i++) {
      await this.registerLocalNotification({
        id: entry.id!,
        type: 'status' in entry ? 'task' : 'thought',
        triggerAt: triggers[i],
        title: `✨ Khơi gợi ký ức (Lần ${i + 1})`,
        body: entry.content
      });
    }
  },

  /**
   * Đăng ký lịch trình Giai đoạn 2 khi bản ghi được Bookmark.
   * [7d, 30d, 4 tháng] - Duy trì những ký ức quan trọng.
   */
  async scheduleExtended(entry: ITask | IThought): Promise<void> {
    const triggers = SparkEngine.calculateExtendedSchedule(entry.createdAt);
    if (triggers.length === 0) return;

    for (let i = 0; i < triggers.length; i++) {
      await this.registerLocalNotification({
        id: entry.id!,
        type: 'status' in entry ? 'task' : 'thought',
        triggerAt: triggers[i],
        title: `💎 Kho báu ý thức`,
        body: entry.content
      });
    }
  },

  /**
   * Thiết lập thông báo nhắc lại sau (Snooze).
   * Mặc định là 30 phút kể từ hiện tại.
   */
  async snooze(entry: ITask | IThought, minutes: number = 30): Promise<void> {
    const triggerAt = Date.now() + (minutes * 60 * 1000);
    
    await this.registerLocalNotification({
      id: entry.id!,
      type: 'status' in entry ? 'task' : 'thought',
      triggerAt,
      title: `⏰ Nhắc lại: ${minutes} phút đã trôi qua`,
      body: entry.content
    });
  },

  /**
   * Giao tiếp với API Thông báo của hệ điều hành.
   * Tích hợp Payload để Deep Linking: /?open=type:id
   */
  async registerLocalNotification(params: {
    id: number;
    type: 'task' | 'thought';
    triggerAt: number;
    title: string;
    body: string;
  }): Promise<void> {
    // Trình duyệt/PWA sử dụng Service Worker Registration
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      /**
       * Cấu trúc Payload cho Deep Linking.
       * Ép kiểu 'as any' để vượt qua kiểm tra nghiêm ngặt của TS đối với 'actions' và 'timestamp'.
       */
      const options = {
        body: params.body.substring(0, 100) + (params.body.length > 100 ? '...' : ''),
        icon: '/icons/icon-192x192.png',
        tag: `spark-${params.type}-${params.id}-${params.triggerAt}`, 
        timestamp: params.triggerAt,
        data: {
          url: `/?open=${params.type}:${params.id}`, 
          entryId: params.id,
          entryType: params.type
        },
        actions: [
          { action: 'view', title: 'Đọc lại' },
          { action: 'snooze', title: 'Snooze (30m)' }
        ]
      } as any;

      /**
       * Thống kê và thực thi đăng ký.
       * Lưu ý: Việc hiển thị thực tế phụ thuộc vào quyền thông báo của người dùng.
       */
      try {
        await registration.showNotification(params.title, options);
        console.log(`[Spark Noti] Registered: ${params.id} at ${new Date(params.triggerAt).toLocaleTimeString()}`);
      } catch (error) {
        console.error("[Spark Noti] Error:", error);
      }
    }
  }
};