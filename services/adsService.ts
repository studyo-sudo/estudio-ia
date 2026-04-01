import { Alert } from 'react-native';
import { ENABLE_FAKE_ADS } from '../constants/env';
import { getBillingState } from './billingStorage';

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function showAdIfFree(): Promise<void> {
  const billing = await getBillingState();

  if (billing.plan === 'premium' || !ENABLE_FAKE_ADS) {
    return;
  }

  Alert.alert(
    'Anuncio',
    'Simulacion de anuncio para el plan Free. Luego puedes reemplazarla por AdMob real.',
    [{ text: 'Continuar' }]
  );

  await wait(900);
}
