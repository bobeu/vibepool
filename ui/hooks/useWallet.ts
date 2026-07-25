import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect, useState, useMemo } from 'react';
import { useUIStore } from '@/store/uiStore';
import { injected } from 'wagmi/connectors';

export const useWallet = () => {
  const showToast = useUIStore((state) => state.showToast);
  const { address, isConnected, isConnecting, connector } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [isReady, setIsReady] = useState(false);

  // Detect MiniPay (must run client-side only)
  const miniPayDetected = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).ethereum?.isMiniPay;
  }, []);

  // Initialize ready state after hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Auto-connect to MiniPay when detected
  useEffect(() => {
    if (!isReady || isConnected || isConnecting || typeof window === 'undefined') return;
    if (!(window as any).ethereum) return;
    if (!miniPayDetected) return;

    const miniPayConnector = injected({ target: 'metaMask' });
    connectAsync({ connector: miniPayConnector }).catch((err: Error) => {
      console.warn('MiniPay auto-connect failed:', err.message);
    });
  }, [isReady, isConnected, isConnecting, miniPayDetected, connectAsync]);

  const connectWallet = async (connectorId?: string) => {
    try {
      const targetConnector = connectorId
        ? connectors.find((c) => c.id === connectorId)
        : connectors.find((c) => c.id === 'injected') || connectors[0];

      if (!targetConnector) throw new Error('No wallet connector available');

      await connectAsync({ connector: targetConnector });
      showToast('Wallet connected!');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Connect wallet error:', err);
      let msg = 'Failed to connect wallet';
      if (err.message?.includes('User rejected')) msg = 'Connection rejected';
      else if (err.message?.includes('No connector')) msg = 'Please use MiniPay or install a Celo wallet';
      showToast(msg);
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnectAsync();
      showToast('Wallet disconnected');
    } catch (err) {
      console.error('Disconnect error:', err);
      showToast('Failed to disconnect');
    }
  };

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isPending,
    isReady,
    miniPayDetected,
    connector,
    connectors,
    connectWallet,
    disconnectWallet,
    formattedAddress: address ? formatAddress(address) : '',
  };
};
