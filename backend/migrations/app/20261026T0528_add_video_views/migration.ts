#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/472d10ca3bf0b500dfeaa5ce63f25ac82a5eee67575d8e2040d84e6055d19335/contract';
import endContract from '../../snapshots/472d10ca3bf0b500dfeaa5ce63f25ac82a5eee67575d8e2040d84e6055d19335/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cef7b6e7c2b7a10a02032adc394de47f4e5bd6cc1f0e75d30c2cdf79bd0d0bcc/contract';
import startContract from '../../snapshots/cef7b6e7c2b7a10a02032adc394de47f4e5bd6cc1f0e75d30c2cdf79bd0d0bcc/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Video',
        column: col('views', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
