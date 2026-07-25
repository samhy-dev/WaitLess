import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

const LOGO_URL =
"https://media.base44.com/images/public/6a620c12cd5b21ebda161706/fb916fee5_Gemini_Generated_Image_1z2w9l1z2w9l1z2w-removebg-preview1.png";

// The Waitless brand logo on a dark rounded chip. Pass a className to size it
// (e.g. "h-8 w-8 rounded-lg").
export default function Logo({ className }) {
  return (
    <span className={cn("flex items-center justify-center rounded-lg bg-slate-900 p-1", className)}>
      <Image src="https://media.base44.com/images/public/6a620c12cd5b21ebda161706/7f6220769_Gemini_Generated_Image_1z2w9l1z2w9l1z2w-removebg-preview__1_.png" alt="Waitless logo" className="h-full w-full" fittingType="fit" />
    </span>);

}