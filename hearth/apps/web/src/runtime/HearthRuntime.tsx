import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';

import { configureHearthClient } from '../api/core';
import { retryStartupRead, startupRetryDelay } from './startupRecovery';
import { runtimeApi as hearthApi } from '../api/runtime';
import { authStatusQueryKey } from '../auth/queryKeys';
import { RuntimeContextValue } from './context';
import { clearIdentityAndReload } from '../auth/signOut';
import { subscribeScreenAccessChange } from '../auth/screenAccessChange';
import {
  phoneInvitationFromHash,
  privatePhoneIntentFromHash,
  stripPhoneIntentFragment,
} from '../auth/phoneInvitation';

const FirstUseSetup = lazy(async () => ({
  default: (await import('../auth/FirstUseSetup')).FirstUseSetup,
}));
const PrivateHouseholdAccess = lazy(async () => ({
  default: (await import('../auth/PrivateHouseholdAccess')).PrivateHouseholdAccess,
}));
const PhoneAccess = lazy(async () => ({
  default: (await import('../auth/PhoneAccess')).PhoneAccess,
}));

export function HearthRuntimeBootstrap({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [phoneIntent, setPhoneIntent] = useState(() =>
    phoneInvitationFromHash(window.location.hash),
  );
  const [privateIntent, setPrivateIntent] = useState(() =>
    privatePhoneIntentFromHash(window.location.hash),
  );
  useLayoutEffect(() => {
    stripPhoneIntentFragment();
  }, []);
  const runtime = useQuery({
    queryKey: ['hearth-runtime'],
    queryFn: ({ signal }) => hearthApi.getRuntime(signal),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: retryStartupRead,
    retryDelay: startupRetryDelay,
    networkMode: 'online',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });
  const auth = useQuery({
    queryKey: authStatusQueryKey,
    queryFn: hearthApi.getAuthStatus,
    enabled:
      runtime.data?.mode === 'private' &&
      (runtime.data.household === null || runtime.data.sharedScreen !== true),
    staleTime: 15_000,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });

  useEffect(() => {
    let switching = false;
    return subscribeScreenAccessChange(() => {
      if (switching) return;
      switching = true;
      void clearIdentityAndReload(queryClient, '/today');
    });
  }, [queryClient]);

  if (runtime.isPending) {
    return (
      <main className="runtime-gate" aria-busy="true" aria-live="polite">
        <img alt="" src="/brand/hearth-mark.png" />
        <h1>Starting Hearth</h1>
        <p>
          {runtime.failureCount > 0
            ? 'Waiting for Hearth… Retrying automatically.'
            : 'Loading this home’s local settings…'}
        </p>
        {runtime.fetchStatus === 'paused' ? (
          <p>Offline · Reconnect to this home’s network.</p>
        ) : null}
      </main>
    );
  }

  if (runtime.isError) {
    return (
      <main className="runtime-gate" role="alert">
        <img alt="" src="/brand/hearth-mark.png" />
        <h1>Hearth could not start</h1>
        <p>Check that the Hearth server is running on this home network, then try again.</p>
        <button className="button button--primary" type="button" onClick={() => runtime.refetch()}>
          Try again
        </button>
      </main>
    );
  }

  if (
    (phoneIntent || privateIntent) &&
    runtime.data.mode === 'private' &&
    runtime.data.sharedScreen !== true
  ) {
    if (auth.isPending) return <SecureSetupLoading />;
    if (auth.data?.accessMethod === 'phone' && auth.data.sharedScreen !== true)
      return (
        <Suspense fallback={<SecureSetupLoading />}>
          <PhoneAccess
            auth={auth.data}
            {...(phoneIntent ? { invitationSecret: phoneIntent } : {})}
            {...(privateIntent ? { privateIntent } : {})}
            timezone={runtime.data.timezone}
            onOwnerConnected={() =>
              clearIdentityAndReload(
                queryClient,
                auth.data?.requiresSetup ? '/admin/get-started' : '/admin/televisions?recovery=1',
              )
            }
            onComplete={async () => {
              setPhoneIntent(null);
              setPrivateIntent(null);
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['hearth-runtime'] }),
                queryClient.invalidateQueries({ queryKey: authStatusQueryKey }),
              ]);
            }}
          />
        </Suspense>
      );
  }
  if (runtime.data.requiresSetup || runtime.data.household === null) {
    if (runtime.data.mode === 'private') {
      if (auth.isPending) {
        return (
          <main className="runtime-gate" aria-busy="true" aria-live="polite">
            <img alt="" src="/brand/hearth-mark.png" />
            <h1>Preparing secure setup</h1>
            <p>Checking this Hearth’s private access settings…</p>
          </main>
        );
      }
      if (auth.isError) {
        return (
          <main className="runtime-gate" role="alert">
            <img alt="" src="/brand/hearth-mark.png" />
            <h1>Secure setup could not start</h1>
            <p>{auth.error.message}</p>
            <button className="button button--primary" type="button" onClick={() => auth.refetch()}>
              Try again
            </button>
          </main>
        );
      }
      const refreshAccess = async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['hearth-runtime'] }),
          queryClient.invalidateQueries({ queryKey: authStatusQueryKey }),
        ]);
      };
      return (
        <Suspense fallback={<SecureSetupLoading />}>
          {runtime.data.requiresSetup ? (
            <FirstUseSetup
              runtime={runtime.data}
              auth={auth.data}
              onComplete={() => clearIdentityAndReload(queryClient, '/admin/get-started')}
            />
          ) : (
            <PrivateHouseholdAccess
              auth={auth.data}
              sharedScreen={runtime.data.sharedScreen === true}
              onComplete={refreshAccess}
              onScreenComplete={() => clearIdentityAndReload(queryClient, '/today')}
            />
          )}
        </Suspense>
      );
    }
    return (
      <main className="runtime-gate">
        <img alt="" src="/brand/hearth-mark.png" />
        <h1>Set up this Hearth</h1>
        <p>
          This private Hearth is empty and ready for an adult to create the real household. No demo
          people or family data have been added.
        </p>
      </main>
    );
  }

  const context = {
    ...runtime.data,
    sharedScreen: runtime.data.sharedScreen === true || auth.data?.sharedScreen === true,
  };
  configureHearthClient(context);
  return <RuntimeContextValue.Provider value={context}>{children}</RuntimeContextValue.Provider>;
}

function SecureSetupLoading() {
  return (
    <main className="runtime-gate" aria-busy="true" aria-live="polite">
      <img alt="" src="/brand/hearth-mark.png" />
      <h1>Preparing secure setup</h1>
      <p>Loading this Hearth’s private setup tools…</p>
    </main>
  );
}
