/**
 * Utility function to send SMS via Geez SMS API
 */
export const sendSMS = async (phone: string, message: string) => {
    try {
        const token = import.meta.env.VITE_SMS_API_TOKEN;
        if (!token) {
            console.warn("SMS token missing. SMS not sent.");
            return false;
        }

        // Format phone number to start with 2519 (or 2517 etc depending on Ethiopian formats)
        // Basic cleanup: remove spaces, +251, 00251, 09 -> 2519
        let formattedPhone = phone.replace(/\s+/g, '');

        if (formattedPhone.startsWith('09')) {
            formattedPhone = '2519' + formattedPhone.substring(2);
        } else if (formattedPhone.startsWith('07')) {
            // Safaricom ET starts with 07
            formattedPhone = '2517' + formattedPhone.substring(2);
        } else if (formattedPhone.startsWith('+251')) {
            formattedPhone = formattedPhone.substring(1); // remove +
        } else if (formattedPhone.startsWith('251')) {
            // already good
        } else {
            // Default fallback, assume they typed 911...
            formattedPhone = '251' + formattedPhone;
        }

        // Handle edge case where message is too long
        const finalMessage = message.substring(0, 330);

        const url = new URL("https://api.geezsms.com/api/v1/sms/send");
        url.searchParams.append("token", token);
        url.searchParams.append("phone", formattedPhone);
        url.searchParams.append("msg", finalMessage);

        console.log(`Sending SMS to ${formattedPhone}...`);

        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'follow'
        });

        const result = await response.text();
        console.log("SMS API Response:", result);

        return true;
    } catch (error) {
        console.error("Failed to send SMS:", error);
        return false;
    }
};
