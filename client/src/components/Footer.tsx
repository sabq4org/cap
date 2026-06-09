import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";
import { FaWhatsapp } from "react-icons/fa";
import logoImage from "@assets/LOGO-L_1769253692563.png";

export default function Footer() {
  const footerLinks = {
    platform: [
      { label: "الرئيسية", href: "/" },
      { label: "المساعد الصحي", href: "/assistant" },
      { label: "التغذية", href: "/nutrition" },
      { label: "المقالات", href: "/articles" },
    ],
    support: [
      { label: "من نحن", href: "/about" },
      { label: "سياسة الخصوصية", href: "/privacy" },
      { label: "شروط الاستخدام", href: "/terms" },
    ],
  };

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="كبسولة" className="h-12 md:h-14" />
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              بوابتك الصحية الذكية. مساعد صحي عربي موثوق مع محتوى طبي مُراجع ومتتبعات صحية متطورة.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm md:text-base">المنصة</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm md:text-base">الدعم</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm md:text-base">تواصل معنا</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="break-all">info@capsulah.com</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span>الرياض، السعودية</span>
              </li>
              <li>
                <a
                  href="https://wa.me/966566252356"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#25D366] transition-colors"
                  data-testid="link-whatsapp-footer"
                >
                  <FaWhatsapp className="h-4 w-4 md:h-5 md:w-5 shrink-0 text-[#25D366]" />
                  <span dir="ltr">+966 56 625 2356</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t text-center space-y-2">
          <p className="text-xs md:text-sm text-muted-foreground">
            © {new Date().getFullYear()} كبسولة. جميع الحقوق محفوظة. | ترخيص إعلامي رقم 160213
          </p>
          <p className="text-xs text-muted-foreground">
            المعلومات المقدمة هي لأغراض تعليمية فقط ولا تغني عن استشارة طبية متخصصة
          </p>
        </div>
      </div>
    </footer>
  );
}
