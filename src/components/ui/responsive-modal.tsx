"use client";

import { Loader } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface BaseProps {
  children: React.ReactNode;
}

interface RootProps extends BaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ChildProps extends BaseProps {
  className?: string;
  asChild?: true;
}

interface FooterProps {
  isPending?: boolean;
  submitLabel: string;
  className?: string;
  asChild?: true;
  /** Optional target form id when the footer is rendered outside the actual <form>. */
  formId?: string;
}

// Context
const ModalContext = React.createContext<{ isDesktop: boolean }>({
  isDesktop: false,
});

const useModalContext = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error("Modal components must be inside <Modal.Root>");
  return context;
};

// Root
const ModalRoot = ({ children, ...props }: RootProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const Component = isDesktop ? Dialog : Drawer;

  return (
    <ModalContext.Provider value={{ isDesktop }}>
      <Component {...props} {...(!isDesktop && { autoFocus: true })}>
        {children}
      </Component>
    </ModalContext.Provider>
  );
};

// Subcomponents
const ModalTrigger = ({ className, children, ...props }: ChildProps) => {
  const { isDesktop } = useModalContext();
  const Component = isDesktop ? DialogTrigger : DrawerTrigger;
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const ModalClose = ({ className, children, ...props }: ChildProps) => {
  const { isDesktop } = useModalContext();
  const Component = isDesktop ? DialogClose : DrawerClose;
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const ModalContent = ({ className, children, ...props }: ChildProps) => {
  const { isDesktop } = useModalContext();
  const Component = isDesktop ? DialogContent : DrawerContent;

  return (
    <Component
      className={cn("p-0 overflow-hidden gap-0", className)}
      {...props}
    >
      {children}
    </Component>
  );
};

const ModalDescription = ({ className, children, ...props }: ChildProps) => {
  const { isDesktop } = useModalContext();
  const Component = isDesktop ? DialogDescription : DrawerDescription;
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const ModalHeader = ({ className, children, ...props }: ChildProps) => {
  const { isDesktop } = useModalContext();
  const Component = isDesktop ? DialogHeader : DrawerHeader;
  return (
    <Component
      className={cn(
        "px-4 pt-3",
        isDesktop ? "" : "border-b shadow-xs",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

const ModalTitle = ({ className, children, ...props }: ChildProps) => {
  const { isDesktop } = useModalContext();
  const Component = isDesktop ? DialogTitle : DrawerTitle;
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

// Body (scrollable)
const ModalBody = ({
  className,
  bodyClassName,
  children,
  ...props
}: ChildProps & {
  bodyClassName?: string;
}) => {
  const { isDesktop } = useModalContext();
  return (
    <div
      className={cn(
        "flex flex-col relative overflow-hidden",
        isDesktop && "max-h-[75dvh] xl:max-h-[90dvh]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "faded-bottom flex-1 overflow-auto px-4 pt-2 pb-8",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};

const ModalFooter = ({ className, children, ...props }: ChildProps) => {
  const { isDesktop } = useModalContext();
  const Component = isDesktop ? DialogFooter : DrawerFooter;
  return (
    <Component
      className={cn("flex gap-2 bg-background px-4", className)}
      {...props}
    >
      {children}
    </Component>
  );
};

// Footer with cancel + submit loader
const ModalFormFooter = ({
  isPending,
  submitLabel,
  className,
  formId,
}: FooterProps) => {
  const { isDesktop } = useModalContext();
  const CancelWrapper = isDesktop ? DialogClose : DrawerClose;

  return (
    <div
      className={cn(
        "flex justify-between gap-2  bg-background px-4 pb-3 pt-3 md:pt-0",
        isDesktop ? "" : "border-t",
        className,
      )}
    >
      <CancelWrapper asChild>
        <Button type="button" variant="outline">
          Cancel
        </Button>
      </CancelWrapper>

      <Button
        type="submit"
        disabled={isPending}
        className="gap-1.5 flex-1"
        {...(formId && { form: formId })}
      >
        {isPending && (
          <Loader className="size-4 animate-spin" aria-hidden="true" />
        )}
        {submitLabel}
      </Button>
    </div>
  );
};

// -----------------------------
// Export grouped
// -----------------------------
export const Modal = {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Close: ModalClose,
  Content: ModalContent,
  Description: ModalDescription,
  Header: ModalHeader,
  Title: ModalTitle,
  Body: ModalBody,
  Footer: ModalFooter,
  FormFooter: ModalFormFooter, // optional ready-made footer
};
