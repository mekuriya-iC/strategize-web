 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";

 interface StrategySelectorProps {
   value?: string;
   onChange?: (value: string) => void;
   className?: string;
 }

 const strategies = ["Strategy 2023/26", "Strategy 2020/23"];

 export default function StrategySelector({
   value,
   onChange,
   className = "",
 }: StrategySelectorProps) {
   return (
     <Select
       value={value}
       onValueChange={onChange}
       defaultValue={strategies[0]}
     >
       <SelectTrigger className={`w-full ${className}`}>
         <SelectValue />
       </SelectTrigger>
       <SelectContent>
         {strategies.map((strategy) => (
           <SelectItem key={strategy} value={strategy}>
             {strategy}
           </SelectItem>
         ))}
       </SelectContent>
     </Select>
   );
 }
