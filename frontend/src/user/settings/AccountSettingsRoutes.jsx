import EmailSettings from './EmailSettings';
import ChangePassword from './ChangePassword';
import PhoneVerification from './PhoneVerification';
import TwoFactorAuth from './TwoFactorAuth';
import ActiveDevices from './ActiveDevices';
import DeactivateAccount from './DeactivateAccount';
import SavedPaymentMethods from './SavedPaymentMethods';
import BillingHistory from './BillingHistory';
import InvoicesReceipts from './InvoicesReceipts';
import ActiveSubscriptions from './ActiveSubscriptions';
import UpgradeCancelPlan from './UpgradeCancelPlan';
import CoinBalance from './CoinBalance';
import CoinEarningHistory from './CoinEarningHistory';
import CoinSpendingHistory from './CoinSpendingHistory';
import BuyRedeemCoins from './BuyRedeemCoins';
import ReferralProgram from './ReferralProgram';
import TimeZoneSettings from './TimeZoneSettings';

const accountSettingsRoutes = [
  { path: '/settings/email', element: <EmailSettings /> },
  { path: '/settings/password', element: <ChangePassword /> },
  { path: '/settings/phone', element: <PhoneVerification /> },
  { path: '/settings/twofactor', element: <TwoFactorAuth /> },
  { path: '/settings/activedevices', element: <ActiveDevices /> },
  { path: '/settings/deactivate', element: <DeactivateAccount /> },
  { path: '/settings/payment-methods', element: <SavedPaymentMethods /> },
  { path: '/settings/billing-history', element: <BillingHistory /> },
  { path: '/settings/invoices', element: <InvoicesReceipts /> },
  { path: '/settings/subscriptions', element: <ActiveSubscriptions /> },
  { path: '/settings/plan', element: <UpgradeCancelPlan /> },
  { path: '/settings/coin-balance', element: <CoinBalance /> },
  { path: '/settings/coin-earning-history', element: <CoinEarningHistory /> },
  { path: '/settings/coin-spending-history', element: <CoinSpendingHistory /> },
  { path: '/settings/buy-redeem-coins', element: <BuyRedeemCoins /> },
  { path: '/settings/referral-program', element: <ReferralProgram /> },
  { path: '/settings/timezone-settings', element: <TimeZoneSettings /> },
];

export default accountSettingsRoutes;