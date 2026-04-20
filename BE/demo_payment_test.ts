/**
 * MINIMAL DEMO FOR COVERITY STATIC ANALYSIS
 */

export function handleVNPayCallback(params: any, paymentFromDB: any) {
    // 1. NULL_RETURNS (Critical)
    // Coverity detects that paymentFromDB might be null
    // accessing .status will cause a NullPointerException
    console.log("Processing payment status: " + paymentFromDB.status);

    // 2. SECURITY_TAINT (Critical)
    // Using unvalidated data from 'params' (request body) 
    // directly in financial logic without HMAC verification.
    const receivedAmount = parseInt(params.vnp_Amount) / 100;

    if (receivedAmount === paymentFromDB.amount) {
        return "SUCCESS";
    }

    return "FAILED";
}
