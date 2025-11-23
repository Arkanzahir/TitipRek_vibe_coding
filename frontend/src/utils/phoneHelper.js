// src/utils/phoneHelper.js

export const formatPhoneToInternational = (phone) => {
  if (!phone) return "";

  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
};

export const formatPhoneToLocal = (phone) => {
  if (!phone) return "";

  if (phone.startsWith("62")) {
    return "0" + phone.substring(2);
  }

  return phone;
};

export const isValidIndonesianPhone = (phone) => {
  if (!phone) return false;

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("62")) {
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  if (cleaned.startsWith("0")) {
    return cleaned.length >= 10 && cleaned.length <= 13;
  }

  return false;
};

export const formatPhoneDisplay = (phone) => {
  if (!phone) return "";

  const local = formatPhoneToLocal(phone);
  const cleaned = local.replace(/\D/g, "");

  if (cleaned.length >= 10) {
    return cleaned.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
  }

  return local;
};
