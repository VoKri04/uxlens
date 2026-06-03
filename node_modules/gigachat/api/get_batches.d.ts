import { AxiosInstance } from 'axios';
import { BatchStatuses, WithXHeaders } from '../interfaces';
interface GetBatchesArgs {
    accessToken?: string;
}
export declare function get_batches(client: AxiosInstance, args: GetBatchesArgs): Promise<BatchStatuses & WithXHeaders>;
export {};
//# sourceMappingURL=get_batches.d.ts.map