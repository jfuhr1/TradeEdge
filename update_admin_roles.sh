#!/bin/bash

# Create a temporary file
sed 's/req\.user\.adminRole !== '\''super_admin'\''/!req.user.adminRoles || !req.user.adminRoles.includes('\''super_admin'\'')/g; 
s/targetUser\.adminRole === '\''super_admin'\''/targetUser.adminRoles \&\& targetUser.adminRoles.includes('\''super_admin'\'')/g;
s/user\.adminRole === '\''super_admin'\''/user.adminRoles \&\& user.adminRoles.includes('\''super_admin'\'')/g' server/routes.ts > temp_file.ts

# Replace the original file with the temporary file
mv temp_file.ts server/routes.ts

# Make the script executable
chmod +x update_admin_roles.sh
