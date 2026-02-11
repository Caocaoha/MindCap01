// App.tsx
import { EchoObserver } from './services/echo/EchoObserver';
// ...
return (
  <>
    <SystemGuard />
    <EchoObserver /> {/* <--- THÊM VÀO ĐÂY */}
    <RouterProvider ... />
  </>
)