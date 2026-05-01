const keyFor = (orderId) => `guestCheckout:${orderId}`;

export function setGuestCheckoutToken(orderId, token) {
  if (!orderId || !token) return;
  try {
    sessionStorage.setItem(keyFor(orderId), token);
  } catch {
    /* ignore */
  }
}

export function getGuestCheckoutToken(orderId) {
  if (!orderId) return null;
  try {
    return sessionStorage.getItem(keyFor(orderId));
  } catch {
    return null;
  }
}

export function clearGuestCheckoutToken(orderId) {
  if (!orderId) return;
  try {
    sessionStorage.removeItem(keyFor(orderId));
  } catch {
    /* ignore */
  }
}
