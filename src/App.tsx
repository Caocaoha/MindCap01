// src/App.tsx (Minh họa)
const App = () => {
  const [isDashboardOpen, setDashboardOpen] = useState(false);
  const { currentQuestionIndex, hasCompletedOnboarding, isInCooldown } = useIdentityStore();
  
  // Logic tự động mở Overlay nhập liệu nếu chưa xong Onboarding
  // (Chỉ mở khi user KHÔNG ở trong cooldown và CHƯA hoàn thành)
  const showOnboardingOverlay = !hasCompletedOnboarding && !isInCooldown && !isDashboardOpen;

  return (
    <div>
      <Header>
        {/* Các nút khác... */}
        <StarCompass onClick={() => setDashboardOpen(true)} />
      </Header>

      <MainContent />

      {/* 1. Dashboard (Thánh đường) - Mở khi click sao */}
      <IdentityDashboard 
        isOpen={isDashboardOpen} 
        onClose={() => setDashboardOpen(false)} 
      />

      {/* 2. Onboarding Input (Phòng tối) - Mở tự động hoặc manual */}
      {/* Lưu ý: Nếu user đang mở Dashboard thì không hiện cái này đè lên */}
      <IdentityOverlay 
        isOpen={showOnboardingOverlay} 
        onClose={() => {/* Logic tạm đóng hoặc force user làm tiếp tuỳ bạn */}} 
      />
    </div>
  );
};