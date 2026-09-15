export { appCheckout, appOnReturn } from '@/shared/platform/app'
export { APP_DEEPLINK, internalUrlDeeplink, openAppScheme } from '@/shared/platform/bridge/appScheme'
export { attachBridgeAuth } from '@/shared/platform/bridge/attachBridgeAuth'
export {
  bridgeCloseAction,
  CLOSE_WEBVIEW_FN,
  CLOSE_WEBVIEW_URL,
  closeWebview
} from '@/shared/platform/bridge/closeWebview'
export { putPaymentEntry } from '@/shared/platform/bridge/paymentEntry'
export type { PartnerEntryParams } from '@/shared/platform/bridge/paymentEntry'
export { applyNativeTopAppBar } from '@/shared/platform/bridge/topAppBar'
export { PlatformContext, usePlatformContext } from '@/shared/platform/context'
export type { PlatformContextValue } from '@/shared/platform/context'
export { isAppUserAgent, PLATFORM_DETECT_SCRIPT, readPlatformKind } from '@/shared/platform/detect'
export { PlatformProvider } from '@/shared/platform/PlatformProvider'
export type { CheckoutTicket, Platform } from '@/shared/platform/types'
export { usePlatform } from '@/shared/platform/usePlatform'
export { webCheckout, webOnReturn } from '@/shared/platform/web'
export { RESULT_PREF, savePaymentResult, toPaymentResultPayload } from '@/shared/platform/bridge/paymentResult'
export type { PaymentResultPayload, PaymentResultType } from '@/shared/platform/bridge/paymentResult'
