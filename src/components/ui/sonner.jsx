import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-sm group-[.toaster]:text-foreground group-[.toaster]:border-border/40 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-2 group-[.toast]:transition-opacity hover:group-[.toast]:opacity-90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-2 hover:group-[.toast]:bg-muted/80",
          title: "group-[.toast]:font-semibold group-[.toast]:text-base",
          icon: "group-[.toast]:text-primary",
        },
      }}
      {...props} 
    />
  );
}

export { Toaster }