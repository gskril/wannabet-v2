import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  address: string
  size?: "sm" | "md" | "lg"
}

export function UserAvatar({ address, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16 md:h-20 md:w-20",
  }

  // Generate avatar using DiceBear API with identicon style
  const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={address} />
      <AvatarFallback>{address.slice(2, 4).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}
