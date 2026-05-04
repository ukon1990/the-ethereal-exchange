import { Pipe, PipeTransform } from '@angular/core';

import { copperToCurrencyAmount } from '../helpers/currency';
import { CurrencyAmount } from '../models/ui-models';

@Pipe({
  name: 'copperToCurrency',
})
export class CopperToCurrencyPipe implements PipeTransform {
  transform(copper: number | null | undefined): CurrencyAmount {
    return copperToCurrencyAmount(copper);
  }
}
