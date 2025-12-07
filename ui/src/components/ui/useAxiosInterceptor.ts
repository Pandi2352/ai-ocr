import { useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useToast } from './ToastContext';

export const useAxiosInterceptor = () => {
    const { showToast } = useToast();

    useEffect(() => {
        const responseInterceptor = api.interceptors.response.use(
            (response) => {
                // You could check for logic errors here even if status is 200
                // For example if backend returns { success: false, ... } for some logic errors
                if (response.data && response.data.success === false) {
                    showToast(response.data.message || 'Operation failed', 'error');
                    return Promise.reject(new Error(response.data.message || 'Operation failed'));
                }
                return response;
            },
            (error) => {
                let message = 'An unexpected error occurred';

                if (error.response) {
                    // Server responded with a status code outside 2xx
                    const data = error.response.data;

                    if (data && data.message) {
                        message = data.message;
                    }

                    // Specific check for Gemini Quota Limit from User Request
                    if (message.includes('429 Too Many Requests') || message.includes('Quota exceeded')) {
                        showToast("Gemini AI Rate Limit Exceeded. Please try again in a few seconds.", 'warning');
                        return Promise.reject(error);
                    }
                } else if (error.request) {
                    // No response received
                    message = 'Network Error. Please check your connection.';
                } else {
                    message = error.message;
                }

                showToast(message, 'error');
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(responseInterceptor);
        };
    }, [showToast]);
};
