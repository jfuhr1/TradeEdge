import { storage } from "./server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername("PortfolioConsultant");
    
    if (existingUser) {
      console.log("User already exists. Updating to admin...");
      
      // Update user to admin if not already
      if (!existingUser.isAdmin) {
        await storage.updateUser(existingUser.id, {
          ...existingUser,
          isAdmin: true,
          adminRole: "super_admin"
        });
        console.log("User updated to admin successfully");
      } else {
        console.log("User is already an admin");
      }
      
      // Check if admin permissions exist
      const existingPermissions = await storage.getAdminPermissions(existingUser.id);
      
      if (!existingPermissions) {
        // Create admin permissions with full access
        await storage.createAdminPermissions({
          userId: existingUser.id,
          canManageUsers: true,
          canManageAdmins: true,
          canCreateAlerts: true,
          canEditAlerts: true,
          canDeleteAlerts: true,
          canCreateEducation: true,
          canEditEducation: true,
          canDeleteEducation: true,
          canManageCoaching: true,
          canManageGroupSessions: true,
          canScheduleSessions: true,
          canViewSessionDetails: true,
          canCreateContent: true,
          canEditContent: true,
          canDeleteContent: true,
          canViewAnalytics: true
        });
        console.log("Admin permissions created successfully");
      } else {
        console.log("Admin permissions already exist");
      }
      
      return existingUser;
    } else {
      // Create new admin user
      console.log("Creating new admin user...");
      
      const hashedPassword = await hashPassword("Jordan26!");
      
      const newUser = await storage.createUser({
        username: "PortfolioConsultant",
        email: "josh.fuhr@bisontrading.co",
        name: "Josh Fuhr",
        password: hashedPassword,
        tier: "premium",
        isAdmin: true,
        adminRole: "super_admin"
      });
      
      console.log("New admin user created successfully");
      
      // Create admin permissions
      await storage.createAdminPermissions({
        userId: newUser.id,
        canManageUsers: true,
        canManageAdmins: true,
        canCreateAlerts: true,
        canEditAlerts: true,
        canDeleteAlerts: true,
        canCreateEducation: true,
        canEditEducation: true,
        canDeleteEducation: true,
        canManageCoaching: true,
        canManageGroupSessions: true,
        canScheduleSessions: true,
        canViewSessionDetails: true,
        canCreateContent: true,
        canEditContent: true,
        canDeleteContent: true,
        canViewAnalytics: true
      });
      
      console.log("Admin permissions created successfully");
      
      return newUser;
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

// Execute the function
createAdminUser()
  .then(user => {
    console.log("Admin setup complete for user:", user.username);
    process.exit(0);
  })
  .catch(error => {
    console.error("Failed to set up admin user:", error);
    process.exit(1);
  });