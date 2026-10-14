import React, { useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TrackingProvider, useTracking } from './context/TrackingContext';
import { VehicleRecord } from './types';
import RoleSelector from './components/auth/RoleSelector';
import OwnerLogin from './components/auth/OwnerLogin';
import GovLogin from './components/auth/GovLogin';
import VehicleSearch from './components/search/VehicleSearch';
import VahanVerificationModal from './components/search/VahanVerificationModal';
import CommandCenter from './components/dashboard/CommandCenter';
import OwnerApprovalModal from './components/notifications/OwnerApprovalModal';
import SMSNotificationDrawer from './components/notifications/SMSNotificationDrawer';
import GPSTransmitterPage from './components/transmitter/GPSTransmitterPage';

function AppContent() {
  const { user, isAuthenticated, loginAsOwner, loginAsGov, logout } = useAuth();
  const {
    selectedVehicle,
    setSelectedVehicle,
    activeSession,
    startTracking,
    approveTracking,
    stopTracking,
    addAuditEntry,
    addNotification,
    notifications,
  } = useTracking();

  const [currentView, setCurrentView] = useState<
    'role-select' | 'owner-login' | 'gov-login' | 'search' | 'verification' | 'dashboard'
  >('role-select');
  const [pendingVehicle, setPendingVehicle] = useState<VehicleRecord | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [pendingFIR, setPendingFIR] = useState('');
  const [pendingEmergencyOverride, setPendingEmergencyOverride] = useState(false);

  const handleSelectRole = useCallback((role: 'owner' | 'government') => {
    setCurrentView(role === 'owner' ? 'owner-login' : 'gov-login');
  }, []);

  const handleOwnerLogin = useCallback(
    (mobile: string, name: string) => {
      loginAsOwner(mobile, name);
      addAuditEntry(
        'User Login',
        name,
        `Vehicle Owner logged in with mobile ${mobile.slice(0, 3)}****${mobile.slice(-3)}`,
        'INFO'
      );
      setCurrentView('search');
    },
    [loginAsOwner, addAuditEntry]
  );

  const handleGovLogin = useCallback(
    (data: {
      email: string;
      badgeId: string;
      department: string;
      state: string;
      rank: string;
      name: string;
    }) => {
      loginAsGov(data);
      addAuditEntry(
        'User Login',
        data.name,
        `${data.rank}, ${data.department} logged in (Badge: ${data.badgeId})`,
        'INFO'
      );
      setCurrentView('search');
    },
    [loginAsGov, addAuditEntry]
  );

  const handleVehicleFound = useCallback(
    (vehicle: VehicleRecord) => {
      setPendingVehicle(vehicle);
      addAuditEntry(
        'Vehicle Lookup',
        user ? user.name : 'Authorized User',
        `Vahan RC lookup for ${vehicle.registrationNumber}`,
        'INFO'
      );
      setCurrentView('verification');
    },
    [addAuditEntry, user]
  );

  const handleStartTracking = useCallback(
    (firNumber?: string, isEmergencyOverride?: boolean) => {
      if (!pendingVehicle || !user) return;

      setPendingFIR(firNumber || '');
      setPendingEmergencyOverride(isEmergencyOverride || false);

      if (user.role === 'owner') {
        // Owner can directly start tracking their own vehicle
        setSelectedVehicle(pendingVehicle);
        startTracking({
          vehicleRegNo: pendingVehicle.registrationNumber,
          initiatedBy: user,
          firNumber: undefined,
          isEmergencyOverride: false,
          ownerApproved: true,
        });
        addAuditEntry(
          'Tracking Started',
          user.name,
          `Owner-initiated tracking for ${pendingVehicle.registrationNumber}`,
          'INFO'
        );
        addNotification({
          type: 'SMS',
          recipient: pendingVehicle.maskedMobile,
          message: `GARUDA NETRA: Live tracking activated for your vehicle ${pendingVehicle.registrationNumber}. You can monitor the location in real-time through the Garuda Netra portal.`,
        });
        setCurrentView('dashboard');
      } else if (user.role === 'government') {
        setSelectedVehicle(pendingVehicle);
        startTracking({
          vehicleRegNo: pendingVehicle.registrationNumber,
          initiatedBy: user,
          firNumber: firNumber || (isEmergencyOverride ? 'EMERGENCY-OVERRIDE' : undefined),
          isEmergencyOverride: !!isEmergencyOverride,
          ownerApproved: !isEmergencyOverride,
        });

        if (isEmergencyOverride) {
          addAuditEntry(
            'Emergency Override',
            user.name,
            `Emergency override tracking for ${pendingVehicle.registrationNumber} - FIR: ${firNumber || 'N/A'}`,
            'WARNING'
          );
          addNotification({
            type: 'SMS',
            recipient: pendingVehicle.maskedMobile,
            message: `GARUDA NETRA ALERT: ${user.department} (Badge #${user.badgeId}) has initiated EMERGENCY GPS tracking for your vehicle ${pendingVehicle.registrationNumber}${firNumber ? ` under FIR #${firNumber}` : ''}. This action has been logged for judicial review.`,
          });
        } else {
          addAuditEntry(
            'Tracking Authorized',
            user.name,
            `Authorized police tracking for ${pendingVehicle.registrationNumber} - FIR: ${firNumber || 'N/A'}`,
            'INFO'
          );
          addNotification({
            type: 'SMS',
            recipient: pendingVehicle.maskedMobile,
            message: `GARUDA NETRA ALERT: ${user.department} (Badge #${user.badgeId}) tracking active for vehicle ${pendingVehicle.registrationNumber} under FIR #${firNumber || 'N/A'}.`,
          });
        }
        setCurrentView('dashboard');
      }
    },
    [pendingVehicle, user, setSelectedVehicle, startTracking, addAuditEntry, addNotification]
  );

  const handleOwnerApprove = useCallback(() => {
    if (!pendingVehicle || !user) return;
    setShowApprovalModal(false);
    setSelectedVehicle(pendingVehicle);
    startTracking({
      vehicleRegNo: pendingVehicle.registrationNumber,
      initiatedBy: user,
      firNumber: pendingFIR,
      isEmergencyOverride: false,
      ownerApproved: true,
    });
    approveTracking();
    addAuditEntry(
      'Owner Approved',
      'Vehicle Owner',
      `Owner approved tracking for ${pendingVehicle.registrationNumber}`,
      'INFO'
    );
    setCurrentView('dashboard');
  }, [pendingVehicle, user, pendingFIR, setSelectedVehicle, startTracking, approveTracking, addAuditEntry]);

  const handleEmergencyOverride = useCallback(() => {
    if (!pendingVehicle || !user) return;
    setShowApprovalModal(false);
    setSelectedVehicle(pendingVehicle);
    startTracking({
      vehicleRegNo: pendingVehicle.registrationNumber,
      initiatedBy: user,
      firNumber: pendingFIR,
      isEmergencyOverride: true,
      ownerApproved: false,
    });
    addAuditEntry(
      'Emergency Override',
      user.role === 'government' ? user.name : 'Authorized Officer',
      `Emergency override activated for ${pendingVehicle.registrationNumber}`,
      'WARNING'
    );
    addNotification({
      type: 'SMS',
      recipient: pendingVehicle.maskedMobile,
      message: `GARUDA NETRA ALERT: Emergency warrant override has been activated for your vehicle ${pendingVehicle.registrationNumber}. This action is being audited.`,
    });
    setCurrentView('dashboard');
  }, [pendingVehicle, user, pendingFIR, setSelectedVehicle, startTracking, addAuditEntry, addNotification]);

  const handleStopTracking = useCallback(() => {
    addAuditEntry(
      'Tracking Stopped',
      user ? user.name : 'Unknown',
      `Tracking session ended`,
      'INFO'
    );
    stopTracking();
    setPendingVehicle(null);
    setCurrentView('search');
  }, [stopTracking, addAuditEntry, user]);

  const handleLogout = useCallback(() => {
    stopTracking();
    logout();
    setPendingVehicle(null);
    setCurrentView('role-select');
  }, [stopTracking, logout]);

  // Render view based on state
  const renderView = () => {
    switch (currentView) {
      case 'role-select':
        return <RoleSelector onSelectRole={handleSelectRole} />;
      case 'owner-login':
        return <OwnerLogin onLogin={handleOwnerLogin} onBack={() => setCurrentView('role-select')} />;
      case 'gov-login':
        return <GovLogin onLogin={handleGovLogin} onBack={() => setCurrentView('role-select')} />;
      case 'search':
        return <VehicleSearch onVehicleFound={handleVehicleFound} />;
      case 'verification':
        return (
          <>
            <VehicleSearch onVehicleFound={handleVehicleFound} />
            {pendingVehicle && (
              <VahanVerificationModal
                vehicle={pendingVehicle}
                onClose={() => {
                  setPendingVehicle(null);
                  setCurrentView('search');
                }}
                onStartTracking={handleStartTracking}
              />
            )}
          </>
        );
      case 'dashboard':
        return selectedVehicle ? (
          <CommandCenter vehicle={selectedVehicle} onStopTracking={handleStopTracking} />
        ) : (
          <VehicleSearch onVehicleFound={handleVehicleFound} />
        );
      default:
        return <RoleSelector onSelectRole={handleSelectRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
      {renderView()}

      {/* Owner Approval Modal for Government Initiated Tracking */}
      {showApprovalModal && pendingVehicle && user?.role === 'government' && (
        <OwnerApprovalModal
          isOpen={showApprovalModal}
          vehicleRegNo={pendingVehicle.registrationNumber}
          officerName={user.name}
          officerBadge={user.badgeId}
          officerDepartment={user.department}
          firNumber={pendingFIR}
          ownerMaskedMobile={pendingVehicle.maskedMobile}
          onApprove={handleOwnerApprove}
          onOverride={handleEmergencyOverride}
          onClose={() => setShowApprovalModal(false)}
        />
      )}

      {/* Floating SMS / Notification Log Button */}
      {notifications.length > 0 && (
        <button
          onClick={() => setShowNotificationDrawer(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 shadow-xl shadow-amber-500/10 px-3.5 py-2 rounded-full text-xs font-mono backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          title="Open Notification Log"
        >
          <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-sans font-medium text-slate-200">Alerts</span>
          <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full font-bold text-[10px]">
            {notifications.length}
          </span>
        </button>
      )}

      {/* SMS Notification Drawer */}
      <SMSNotificationDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
        notifications={notifications}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TrackingProvider>
        <Routes>
          <Route path="/transmitter" element={<GPSTransmitterPage />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </TrackingProvider>
    </AuthProvider>
  );
}
