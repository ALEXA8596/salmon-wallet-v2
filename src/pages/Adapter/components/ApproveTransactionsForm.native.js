import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import bs58 from 'bs58';

import { AppContext } from '../../../AppProvider';
import NonSimulatedTransactions from './NonSimulatedTransactions';
import SimulatedTransactions from './SimulatedTransactions';
import SimulatingTransactions from './SimulatingTransactions';
import UnsafeTransactions from './UnsafeTransactions';
import FailedTransactions from './FailedTransactions';

const ApproveTransactionsForm = ({
  payloads = [],
  origin,
  name,
  icon,
  onApprove,
  onReject,
}) => {
  const [{ activeWallet, selectedLanguage: language }] = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [continueAnyway, setContinueAnyway] = useState(false);

  const transactions = useMemo(
    () => payloads.map(payload => bs58.encode(payload)),
    [payloads],
  );

  const scanTransactions = useCallback(async () => {
    setLoading(true);

    try {
      setFee(await activeWallet.estimateTransactionsFee(transactions));
    } catch (err) {
      console.error('Failed to get fee for message:', err);
      setFee(null);
    }

    try {
      const options = { origin, language };
      setSimulation(await activeWallet.scanTransactions(transactions, options));
    } catch (err) {
      console.error('Failed to simulate transactions', err);
      setSimulation(null);
    } finally {
      setLoading(false);
    }
  }, [transactions, origin, language, activeWallet]);

  useEffect(() => {
    scanTransactions();
  }, [scanTransactions]);

  if (loading) {
    return <SimulatingTransactions origin={origin} name={name} icon={icon} />;
  }

  if (!simulation) {
    return (
      <NonSimulatedTransactions
        origin={origin}
        name={name}
        icon={icon}
        onRetry={scanTransactions}
        onApprove={onApprove}
        onReject={onReject}
      />
    );
  }

  if (simulation.action === 'BLOCK' && !continueAnyway) {
    return (
      <UnsafeTransactions
        onApprove={() => setContinueAnyway(true)}
        onReject={onReject}
      />
    );
  }

  if (simulation.simulationResults.error) {
    return (
      <FailedTransactions
        origin={origin}
        name={name}
        icon={icon}
        error={simulation.simulationResults.error}
        onApprove={onApprove}
        onReject={onReject}
      />
    );
  }

  return (
    <SimulatedTransactions
      origin={origin}
      name={name}
      icon={icon}
      simulation={simulation}
      fee={fee}
      onApprove={onApprove}
      onReject={onReject}
    />
  );
};

export default ApproveTransactionsForm;