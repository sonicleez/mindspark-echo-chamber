
import { toast } from "sonner";

// Cấu hình mặc định cho toast
toast.success = (message, options) => 
  toast(message, {
    ...options,
    className: 'bg-[#1A1A1A] border border-[#333] text-white',
    style: { backgroundColor: '#1A1A1A', color: 'white' },
    duration: 4000,
  });

toast.error = (message, options) => 
  toast.error(message, {
    ...options,
    className: 'bg-[#1A1A1A] border border-[#333] text-white',
    style: { backgroundColor: '#1A1A1A', color: 'white' },
    duration: 4000,
  });

export { toast };
