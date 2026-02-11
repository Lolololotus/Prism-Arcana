
declare global {
    interface Window {
        IMP: any; // Portone V1/V2 global object
    }
}

export const initializePayment = () => {
    if (typeof window !== "undefined" && !window.IMP) {
        // Load Portone Script dynamically if not present
        const script = document.createElement("script");
        script.src = "https://cdn.iamport.kr/v1/iamport.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            const IMP = window.IMP;
            // Replace with user's Portone Store ID (imp******) eventually
            // Using a test ID or leaving blank for now, will prompt user later
            IMP.init("imp45285324"); // Example Test Code
        };
    }
};

export const requestPayment = (itemName: string, amount: number, buyerEmail: string, onSuccess: () => void, onError: (msg: string) => void) => {
    if (!window.IMP) {
        onError("Payment module not loaded. Please refresh.");
        return;
    }

    const IMP = window.IMP;
    IMP.request_pay({
        pg: "html5_inicis", // PG Provider (Test Mode)
        pay_method: "card",
        merchant_uid: `mid_${new Date().getTime()}`,
        name: itemName,
        amount: amount,
        buyer_email: buyerEmail,
        buyer_name: "Lotus",
        buyer_tel: "010-1234-5678",
    }, (rsp: any) => {
        if (rsp.success) {
            onSuccess();
        } else {
            onError(rsp.error_msg);
        }
    });
};
