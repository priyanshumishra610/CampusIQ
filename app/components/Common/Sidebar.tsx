/**
 * Premium Sidebar Navigation Component
 * 
 * Enterprise-grade sidebar with:
 * - Dark/Glass theme with subtle blur
 * - Smooth animations
 * - Role-based navigation
 * - Responsive (drawer on mobile, fixed on tablet/desktop)
 * - Active tab highlighting with glow effect
 * 
 * Design inspired by: Notion, Linear, Keka, Jira
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {RootState} from '../../redux/store';
import {signOut} from '../../redux/slices/authSlice';
import {getSidebarConfig, SidebarMenuItem} from '../../config/sidebarConfig';
import {Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';
import {useTheme} from '../../theme/ThemeContext';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 72;
const IS_TABLET = SCREEN_WIDTH >= 768;

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: (route: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const dispatch = useDispatch();
  const {colors, theme} = useTheme();
  const {user} = useSelector((state: RootState) => state.auth);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const config = user ? getSidebarConfig(user.role) : null;
  const currentRoute = route.name;

  const handleNavigate = useCallback(
    (item: SidebarMenuItem) => {
      if (item.id === 'logout') {
        dispatch(signOut() as any);
        return;
      }

      if (onNavigate) {
        onNavigate(item.route);
      } else {
        // Try to navigate - handle nested navigation structure
        try {
          // First try direct navigation
          navigation.navigate(item.route as never);
        } catch (error) {
          // If that fails, try navigating to the home screen first, then the specific tab
          try {
            const routeParts = item.route.split('/');
            if (routeParts.length > 1) {
              navigation.navigate(routeParts[0] as never, {
                screen: routeParts[1],
              } as never);
            } else {
              // For tab navigators, navigate to the parent then the tab
              const parentRoute = user?.role === 'STUDENT' ? 'StudentHome' :
                                 user?.role === 'FACULTY' ? 'FacultyHome' :
                                 user?.role === 'ADMIN' ? 'AdminHome' :
                                 user?.role === 'SUPPORT' ? 'SupportHome' :
                                 user?.role === 'SECURITY' ? 'SecurityHome' : 'AdminHome';
              navigation.navigate(parentRoute as never, {
                screen: item.route,
              } as never);
            }
          } catch (nestedError) {
            console.warn(`Navigation to ${item.route} failed:`, nestedError);
          }
        }
      }
    },
    [navigation, dispatch, onNavigate, user],
  );

  const isActive = (routeName: string): boolean => {
    return currentRoute === routeName || currentRoute.includes(routeName);
  };

  const handleLogout = useCallback(() => {
    dispatch(signOut() as any);
  }, [dispatch]);

  if (!config || !user) {
    return null;
  }

  const renderMenuItem = (item: SidebarMenuItem, index: number) => {
    const active = isActive(item.route);
    const showSection = item.section && index === 0;

    return (
      <View key={item.id}>
        {showSection && (
          <View style={styles.sectionHeader}>
            {!collapsed && (
              <Text style={styles.sectionHeaderText}>{item.section}</Text>
            )}
          </View>
        )}
        {index > 0 &&
          config.menuItems[index - 1]?.section !== item.section &&
          item.section && (
            <View style={styles.sectionHeader}>
              {!collapsed && (
                <Text style={styles.sectionHeaderText}>{item.section}</Text>
              )}
            </View>
          )}
        <TouchableOpacity
          style={[styles.menuItem, active && styles.menuItemActive]}
          onPress={() => handleNavigate(item)}
          activeOpacity={0.7}>
          {active && (
            <View style={styles.activeIndicator}>
              <LinearGradient
                colors={['rgba(100, 181, 246, 0.2)', 'rgba(100, 181, 246, 0.05)']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.activeGradient}
              />
            </View>
          )}
          <View style={styles.menuItemContent}>
            <View
              style={[
                styles.iconContainer,
                active && styles.iconContainerActive,
              ]}>
              <Icon
                name={item.icon}
                size={22}
                color={active ? colors.primaryAccent : colors.textTertiary}
              />
            </View>
            {!collapsed && (
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.menuItemLabel,
                    {color: active ? colors.primaryAccent : colors.textSecondary},
                    active && styles.menuItemLabelActive,
                  ]}>
                  {item.label}
                </Text>
                {item.badge !== undefined && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBottomItem = (item: SidebarMenuItem) => {
    const active = isActive(item.route);
    const isLogout = item.id === 'logout';

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.bottomItem,
          isLogout && styles.logoutItem,
          active && styles.bottomItemActive,
        ]}
        onPress={() => (isLogout ? handleLogout() : handleNavigate(item))}
        activeOpacity={0.7}>
        <View style={styles.menuItemContent}>
          <View
            style={[
              styles.iconContainer,
              active && styles.iconContainerActive,
              isLogout && styles.logoutIconContainer,
            ]}>
              <Icon
                name={item.icon}
                size={20}
                color={
                  isLogout
                    ? colors.error
                    : active
                    ? colors.primaryAccent
                    : colors.textTertiary
                }
              />
          </View>
          {!collapsed && (
            <Text
              style={[
                styles.bottomItemLabel,
                {
                  color: isLogout
                    ? colors.error
                    : active
                    ? colors.primaryAccent
                    : colors.textTertiary,
                },
                isLogout && styles.logoutLabel,
                active && styles.bottomItemLabelActive,
              ]}>
              {item.label}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.sidebar,
        collapsed && styles.sidebarCollapsed,
        {width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH},
      ]}>
      {/* Glass effect background */}
      <LinearGradient
        colors={
          theme === 'dark'
            ? [
                'rgba(12, 18, 34, 0.98)',
                'rgba(30, 58, 95, 0.95)',
                'rgba(12, 18, 34, 0.98)',
              ]
            : [
                'rgba(30, 58, 95, 0.98)',
                'rgba(45, 90, 135, 0.95)',
                'rgba(30, 58, 95, 0.98)',
              ]
        }
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientBackground}
      />

      {/* Logo/Brand Section */}
      <View style={styles.logoSection}>
        {!collapsed ? (
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>IQ</Text>
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandText}>CampusIQ</Text>
              <Text style={styles.brandSubtext}>
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()} Portal
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>IQ</Text>
            </View>
          </View>
        )}
        {onToggleCollapse && (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={onToggleCollapse}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Icon
              name={collapsed ? 'chevron-right' : 'chevron-left'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Main Menu Items */}
      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuScrollContent}
        showsVerticalScrollIndicator={false}>
        {config.menuItems.map((item, index) => renderMenuItem(item, index))}
      </ScrollView>

      {/* Bottom Section Divider */}
      <View style={styles.divider} />

      {/* Bottom Menu Items (Settings, Help, Logout) */}
      <View style={styles.bottomSection}>
        {config.bottomItems.map(item => renderBottomItem(item))}
      </View>

      {/* User Profile Section (Optional - can be expanded) */}
      {!collapsed && (
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name || 'User'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email || ''}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: 'rgba(100, 181, 246, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sidebarCollapsed: {
    alignItems: 'center',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  logoSection: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(100, 181, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(100, 181, 246, 0.5)',
  },
  logoText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.extrabold,
    color: '#64b5f6',
  },
  brandTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  brandText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.extrabold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandSubtext: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(168, 196, 224, 0.8)',
    marginTop: 2,
    fontWeight: Typography.fontWeight.medium,
  },
  collapseButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.base,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(100, 181, 246, 0.1)',
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionHeaderText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    marginVertical: 2,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: 'rgba(100, 181, 246, 0.08)',
  },
  activeIndicator: {
    ...StyleSheet.absoluteFillObject,
  },
  activeGradient: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(100, 181, 246, 0.15)',
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  menuItemLabelActive: {
    fontWeight: Typography.fontWeight.semibold,
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  bottomSection: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 181, 246, 0.1)',
  },
  bottomItem: {
    marginVertical: 2,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  bottomItemActive: {
    backgroundColor: 'rgba(100, 181, 246, 0.08)',
  },
  logoutItem: {
    marginTop: Spacing.md,
  },
  logoutIconContainer: {},
  bottomItemLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  bottomItemLabelActive: {},
  logoutLabel: {},
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 181, 246, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(100, 181, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(100, 181, 246, 0.5)',
  },
  userAvatarText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: '#64b5f6',
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#ffffff',
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
});

export default Sidebar;

