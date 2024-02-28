export class StringFormatter {
    public static numberWithCommas(num: number): string {
        return num.toString().replace(new RegExp('\\B(?=(\\d{3})+(?!\\d))', 'g'), ",");
    }
}
