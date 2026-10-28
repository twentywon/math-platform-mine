// Enumerate every spanning tree, quotienting by all rotations and reflections.
// A bitset records entire symmetry orbits; no random sampling is used.
#include <algorithm>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <vector>
using namespace std;
int n,m,g,parent_[20],size_[20];
vector<pair<int,int>> edges;
vector<vector<int>> permutations;
vector<uint64_t> seen;
vector<uint32_t> representatives;
uint64_t trees=0;
int root(int x){while(parent_[x]!=x)x=parent_[x];return x;}
void visit(uint32_t mask){
 ++trees;
 if((seen[mask>>6]>>(mask&63))&1)return;
 representatives.push_back(mask);
 for(const auto &p:permutations){uint32_t mapped=0,bits=mask;while(bits){int edge=__builtin_ctz(bits);mapped|=uint32_t(1)<<p[edge];bits&=bits-1;}seen[mapped>>6]|=uint64_t(1)<<(mapped&63);}
}
void enumerate(int index,int selected,uint32_t mask){
 if(selected==n-1){visit(mask);return;}
 if(index==m||selected+m-index<n-1)return;
 int a=root(edges[index].first),b=root(edges[index].second);
 if(a!=b){if(size_[a]<size_[b])swap(a,b);parent_[b]=a;size_[a]+=size_[b];enumerate(index+1,selected+1,mask|(uint32_t(1)<<index));size_[a]-=size_[b];parent_[b]=b;}
 enumerate(index+1,selected,mask);
}
int main(int argc,char**argv){
 if(argc!=3)return 1;ifstream input(argv[1]);input>>n>>m>>g;if(!input||m>30||n>20)return 2;
 for(int i=0,a,b;i<m;i++){input>>a>>b;edges.push_back({a,b});}
 for(int k=0;k<g;k++){vector<int>p(m);for(int&i:p)input>>i;permutations.push_back(p);}
 for(int i=0;i<n;i++){parent_[i]=i;size_[i]=1;}
 seen.resize(((uint64_t(1)<<m)+63)>>6);
 enumerate(0,0,0);
 sort(representatives.begin(),representatives.end());
 ofstream output(argv[2],ios::binary);
 // Portable little-endian uint32 representation.
 for(uint32_t mask:representatives)for(int i=0;i<4;i++)output.put(char(mask>>(8*i)));
 cout<<"Spanning trees: "<<trees<<"; inequivalent nets: "<<representatives.size()<<"\n";
}
