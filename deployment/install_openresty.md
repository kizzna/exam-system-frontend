# openresty
sudo systemctl disable nginx
sudo systemctl stop nginx
sudo apt remove -y nginx

# Step 1: we should install some prerequisites needed by adding GPG public keys (could be removed later):
sudo apt-get -y install --no-install-recommends wget gnupg ca-certificates lsb-release

# Step 2: import our GPG key:
sudo wget -O - https://openresty.org/package/pubkey.gpg | sudo gpg --dearmor -o /usr/share/keyrings/openresty.gpg

# Step 3: then add the our official APT repository.
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/openresty.gpg] http://openresty.org/package/ubuntu $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/openresty.list > /dev/null

# Step 4: update the APT index:
sudo configure_apt_proxy.sh
sudo apt-get update
sudo apt-get -y install openresty
