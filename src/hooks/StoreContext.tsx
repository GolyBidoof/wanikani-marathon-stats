import type { ReactNode } from 'react';
import StoreEffects from '../store/storeEffects';

export { useAppStore as useStore } from '../store/appStore';

export function StoreProvider({ children, allUsers }: { children: ReactNode; allUsers: string[] }) {
  return (
    <>
      <StoreEffects allUsers={allUsers} />
      {children}
    </>
  );
}
