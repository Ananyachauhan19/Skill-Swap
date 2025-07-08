import React from "react";
import { Route } from "react-router-dom";
import EmailSettings from "./EmailSettings";
import ChangePassword from "./ChangePassword";
import PhoneVerification from "./PhoneVerification";
import TwoFactorAuth from "./TwoFactorAuth";
import ActiveDevices from "./ActiveDevices";
import DeactivateAccount from "./DeactivateAccount";
import SavedPaymentMethods from "./SavedPaymentMethods";
import BillingHistory from "./BillingHistory";
import InvoicesReceipts from "./InvoicesReceipts";
import ActiveSubscriptions from "./ActiveSubscriptions";
import UpgradeCancelPlan from "./UpgradeCancelPlan";
import CoinBalance from "./CoinBalance";
import CoinEarningHistory from "./CoinEarningHistory";
import CoinSpendingHistory from "./CoinSpendingHistory";
import BuyRedeemCoins from "./BuyRedeemCoins";
import MySessions from "../records/MySessions";
import PastBookings from "../records/PastBookings";
import SkillBadges from "../records/SkillBadges";
import HelpSupportPage from "../support/HelpSupportPage";
import SupportHistory from "../support/SupportHistory";
import ReferralProgram from "./ReferralProgram";
import TimeZoneSettings from "./TimeZoneSettings";


const AccountSettingsRoutes = () => (
  <>
    <Route path="/settings/email" element={<EmailSettings />} />
    <Route path="/settings/password" element={<ChangePassword />} />
    <Route path="/settings/phone" element={<PhoneVerification />} />
    <Route path="/settings/twofactor" element={<TwoFactorAuth />} />
    <Route path="/settings/activedevices" element={<ActiveDevices />} />
    <Route path="/settings/deactivate" element={<DeactivateAccount />} />
    <Route path="/settings/payment-methods" element={<SavedPaymentMethods />} />
    <Route path="/settings/billing-history" element={<BillingHistory />} />
    <Route path="/settings/invoices" element={<InvoicesReceipts />} />
    <Route path="/settings/subscriptions" element={<ActiveSubscriptions />} />
    <Route path="/settings/plan" element={<UpgradeCancelPlan />} />
    <Route path="/settings/coin-balance" element={<CoinBalance />} />
    <Route path="/settings/coin-earning-history" element={<CoinEarningHistory />} />
    <Route path="/settings/coin-spending-history" element={<CoinSpendingHistory />} />
    <Route path="/settings/buy-redeem-coins" element={<BuyRedeemCoins />} />
    <Route path="/settings/my-sessions" element={<MySessions />} />
    <Route path="/settings/past-bookings" element={<PastBookings />} />
    <Route path="/settings/skill-badges" element={<SkillBadges />} />
    <Route path="/help" element={<HelpSupportPage />} />
    <Route path="/settings/support-history" element={<SupportHistory />} />
    <Route path="/settings/referral-program" element={<ReferralProgram />} />
    <Route path="/settings/timezone-settings" element={<TimeZoneSettings />} />
  </>
);

export default AccountSettingsRoutes;
