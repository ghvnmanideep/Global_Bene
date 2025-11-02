import axiosInstance from '../utils/axiosinstance';

const contactService = {
  sendContactEmail: async (data) => {
    const response = await axiosInstance.post('/contact/send', data);
    return response.data;
  },
};

export { contactService };
