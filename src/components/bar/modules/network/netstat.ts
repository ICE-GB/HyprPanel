import options from 'src/options.ts';
import { bind, Variable } from 'astal';
import { NetworkResourceData } from 'src/lib/types/customModules/network.types';
import { getDefaultNetstatData } from 'src/lib/types/defaults/netstat.types';
import { FunctionPoller } from 'src/lib/poller/FunctionPoller.ts';
import { NetstatLabelType, RateUnit } from 'src/lib/types/bar.types';
import { computeNetwork } from '../netstat/helpers';

const { labelType, networkInterface, rateUnit, networkInLabel, networkOutLabel, round, pollingInterval } =
    options.bar.customModules.netstat;

export const networkUsage = Variable<NetworkResourceData>(getDefaultNetstatData(rateUnit.get()));

const netstatPoller = new FunctionPoller<
    NetworkResourceData,
    [round: Variable<boolean>, interfaceNameVar: Variable<string>, dataType: Variable<RateUnit>]
>(
    networkUsage,
    [bind(rateUnit), bind(networkInterface), bind(round)],
    bind(pollingInterval),
    computeNetwork,
    round,
    networkInterface,
    rateUnit,
);

netstatPoller.initialize('network');

const renderNetworkLabel = (lblType: NetstatLabelType, networkService: NetworkResourceData): string => {
    switch (lblType) {
        case 'in':
            return `${networkInLabel.get()} ${networkService.in}`;
        case 'out':
            return `${networkOutLabel.get()} ${networkService.out}`;
        default:
            return `${networkOutLabel.get()} ${networkService.out} ${networkInLabel.get()} ${networkService.in}`;
    }
};

export const netstatLabel = Variable.derive(
    [bind(networkUsage), bind(labelType)],
    (networkService: NetworkResourceData, lblTyp: NetstatLabelType) => renderNetworkLabel(lblTyp, networkService),
);
