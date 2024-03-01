const suffixes: string[] = ['k', 'M', 'G', 'T', 'P', 'E'];

export class StringFormatter {
    public static numberWithCommas(num: number): string {
        return num.toString().replace(new RegExp('\\B(?=(\\d{3})+(?!\\d))', 'g'), ",");
    }

    public static phone(phone: number): string {
        const filteredValue: string = phone.toString().replace('-', '');
        if (filteredValue.length > 3) {
            return `${filteredValue.substring(0, 3)}-${filteredValue.substring(3)}`;
        }
    
        return phone.toString();
    }

    public static thousands(input: number, args?: number): string | number | null {
        let isNegative: boolean = input < 0;
        input = Math.abs(input);
    
        if (Number.isNaN(input)) {
            return null;
        }
    
        if (input < 1000) {
            return input;
        }
    
        const exp: number = Math.floor(Math.log(input) / Math.log(1000));
        return (
            (isNegative ? '-' : '') + (input / Math.pow(1000, exp)).toFixed(args) + suffixes[exp - 1]
        );
    }
}
