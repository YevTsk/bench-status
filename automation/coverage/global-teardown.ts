import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './coverage.config';

export default async function globalTeardown() {
    const mcr = MCR(coverageOptions);
    await mcr.generate();
}
