import { YearlyData } from "@/lib/projectModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CashFlowTableProps {
  yearlyData: YearlyData[];
}

export const CashFlowTable = ({ yearlyData }: CashFlowTableProps) => {
  const formatNumber = (value: number) => {
    if (value === 0) return "0";
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
  };

  const getCellClass = (value: number) => {
    if (value > 0) return "text-emerald-600 dark:text-emerald-400";
    if (value < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="sticky left-0 bg-muted/50 font-semibold min-w-[80px]">Năm</TableHead>
            <TableHead className="text-right font-semibold min-w-[120px]">Doanh thu</TableHead>
            <TableHead className="text-right font-semibold min-w-[120px]">Chi phí SX</TableHead>
            <TableHead className="text-right font-semibold min-w-[100px]">Khấu hao</TableHead>
            <TableHead className="text-right font-semibold min-w-[100px]">Lãi vay</TableHead>
            <TableHead className="text-right font-semibold min-w-[100px]">Trả gốc</TableHead>
            <TableHead className="text-right font-semibold min-w-[100px]">Thuế</TableHead>
            <TableHead className="text-right font-semibold min-w-[120px]">NCF TIPV</TableHead>
            <TableHead className="text-right font-semibold min-w-[120px]">NCF EPV</TableHead>
            <TableHead className="text-right font-semibold min-w-[120px]">Lũy kế TIPV</TableHead>
            <TableHead className="text-right font-semibold min-w-[120px]">Lũy kế EPV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {yearlyData.map((row, index) => (
            <TableRow key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              <TableCell className="sticky left-0 bg-inherit font-medium">{row.year}</TableCell>
              <TableCell className={`text-right ${getCellClass(row.revenue)}`}>
                {formatNumber(row.revenue)}
              </TableCell>
            <TableCell className={`text-right ${getCellClass(-row.cogs)}`}>
                {formatNumber(row.cogs)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatNumber(row.depreciation)}
              </TableCell>
              <TableCell className={`text-right ${getCellClass(-row.interestPayment)}`}>
                {formatNumber(row.interestPayment)}
              </TableCell>
              <TableCell className={`text-right ${getCellClass(-row.principalPayment)}`}>
                {formatNumber(row.principalPayment)}
              </TableCell>
              <TableCell className={`text-right ${getCellClass(-row.tax)}`}>
                {formatNumber(row.tax)}
              </TableCell>
              <TableCell className={`text-right font-medium ${getCellClass(row.ncfTIPV)}`}>
                {formatNumber(row.ncfTIPV)}
              </TableCell>
              <TableCell className={`text-right font-medium ${getCellClass(row.ncfEPV)}`}>
                {formatNumber(row.ncfEPV)}
              </TableCell>
              <TableCell className={`text-right ${getCellClass(row.cumulativePV_TIPV)}`}>
                {formatNumber(row.cumulativePV_TIPV)}
              </TableCell>
              <TableCell className={`text-right ${getCellClass(row.cumulativePV_EPV)}`}>
                {formatNumber(row.cumulativePV_EPV)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
