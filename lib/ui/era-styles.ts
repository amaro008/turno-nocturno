/** Mapeo era_profile → clase de tema. En MVP solo vhs-80s. */
export function eraThemeClass(eraProfile: string): string {
  switch (eraProfile) {
    case 'vhs-80s':
      return 'era-vhs-80s';
    default:
      return 'era-default';
  }
}
