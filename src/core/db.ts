// src/core/db.ts
db.version(2).stores({
    tasks: 'id, content, createdAt, tags, *linkedIds, nextReviewAt', // Thêm index cho nextReviewAt
    thoughts: 'id, content, createdAt, tags, *linkedIds, nextReviewAt',
    userState: 'id'
  });