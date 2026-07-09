import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './coverage.config';

export default async function globalSetup() {
    const mcr = MCR(coverageOptions);
    await mcr.cleanCache();
}
