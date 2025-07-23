import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  UserPlus,
  UserMinus,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Users,
  Heart,
  MessageCircle,
  Verified
} from 'lucide-react';
import { vibesApi } from '@/lib/vibes-api';

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  verified?: boolean;
  stats: {
    following: number;
    followers: number;
    posts: number;
    likes: number;
  };
  isFollowing?: boolean;
}

interface UserCardProps {
  user: User;
  onFollow?: (userId: number) => void;
  onUnfollow?: (userId: number) => void;
  onUserClick?: (username: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

export default function UserCard({ 
  user, 
  onFollow, 
  onUnfollow, 
  onUserClick,
  compact = false,
  showActions = true 
}: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(user.stats.followers);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        const response = await vibesApi.social.unfollow(user.id);
        if (response.ok) {
          setIsFollowing(false);
          setFollowerCount(prev => prev - 1);
          onUnfollow?.(user.id);
        }
      } else {
        const response = await vibesApi.social.follow(user.id);
        if (response.ok) {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
          onFollow?.(user.id);
        }
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUserClick = () => {
    onUserClick?.(user.username);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg">
        <Avatar 
          className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleUserClick}
        >
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div 
            className="font-medium text-sm text-foreground hover:underline cursor-pointer flex items-center gap-1"
            onClick={handleUserClick}
          >
            {user.name}
            {user.verified && (
              <Verified className="h-3 w-3 text-blue-500 fill-current" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">@{user.username}</div>
          <div className="text-xs text-muted-foreground">{followerCount.toLocaleString()} followers</div>
        </div>
        
        {showActions && (
          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={handleFollow}
            disabled={followLoading}
            className="h-8 px-3"
          >
            {followLoading ? (
              'Loading...'
            ) : isFollowing ? (
              <>
                <UserMinus className="h-3 w-3 mr-1" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar 
            className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleUserClick}
          >
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div 
              className="font-semibold text-foreground hover:underline cursor-pointer flex items-center gap-1 mb-1"
              onClick={handleUserClick}
            >
              {user.name}
              {user.verified && (
                <Verified className="h-4 w-4 text-blue-500 fill-current" />
              )}
            </div>
            <div className="text-sm text-muted-foreground mb-2">@{user.username}</div>
            
            {user.bio && (
              <p className="text-sm text-foreground mb-3 leading-relaxed">{user.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {new Date(user.joinedAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            </div>
            
            <div className="flex gap-4 text-sm mb-3">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.stats.following.toLocaleString()}</span>
                <span className="text-muted-foreground">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{followerCount.toLocaleString()}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.stats.posts.toLocaleString()}</span>
                <span className="text-muted-foreground">Posts</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.stats.likes.toLocaleString()}</span>
                <span className="text-muted-foreground">Likes</span>
              </div>
            </div>
            
            {showActions && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
                disabled={followLoading}
                className="w-full"
              >
                {followLoading ? (
                  'Loading...'
                ) : isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
